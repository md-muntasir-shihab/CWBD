import cron from 'node-cron';
import UserSubscription from '../models/UserSubscription';
import User from '../models/User';
import ActiveSession from '../models/ActiveSession';
import { StudentSettingsModel } from '../models/StudentSettings';
import { sendNotificationToStudent } from '../services/notificationProviderService';
import { triggerAutoSend } from '../services/notificationOrchestrationService';
import { logger } from '../utils/logger';

// Map reminder day count to template key
const REMINDER_TEMPLATE_MAP: Record<number, string> = {
  7: 'SUB_EXPIRY_7D',
  3: 'SUB_EXPIRY_3D',
  1: 'SUB_EXPIRY_1D',
};

function dayStart(d: Date): Date {
  const s = new Date(d);
  s.setUTCHours(0, 0, 0, 0);
  return s;
}

function dayEnd(d: Date): Date {
  const e = new Date(d);
  e.setUTCHours(23, 59, 59, 999);
  return e;
}

async function runSubscriptionExpiryCheck(): Promise<void> {
  logger.info('[subscriptionExpiryCron] Starting run');

  // 1. Load settings
  let settings: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (StudentSettingsModel as any).getDefault() as Record<string, unknown>;
  } catch (err) {
    logger.error('[subscriptionExpiryCron] Failed to load StudentSettings', undefined, {
      error: String(err),
    });
    return;
  }

  const now = new Date();

  // -------------------------------------------------------------------------
  // 2. Send reminder notifications
  // -------------------------------------------------------------------------
  const reminderDays: number[] = Array.isArray(settings['expiryReminderDays'])
    ? (settings['expiryReminderDays'] as number[])
    : [7, 3, 1];

  for (const reminderDay of reminderDays) {
    const targetDate  = new Date(now.getTime() + reminderDay * 24 * 60 * 60 * 1000);
    const windowStart = dayStart(targetDate);
    const windowEnd   = dayEnd(targetDate);
    const todayStart  = dayStart(now);
    const todayEnd    = dayEnd(now);
    const templateKey = REMINDER_TEMPLATE_MAP[reminderDay] ?? `SUB_EXPIRY_${reminderDay}D`;

    let subscriptionsToRemind: Record<string, unknown>[] = [];
    try {
      subscriptionsToRemind = await UserSubscription.find({
        status: 'active',
        expiresAtUTC: { $gte: windowStart, $lte: windowEnd },
        $or: [
          { lastReminderSentAtUTC: null },
          { lastReminderSentAtUTC: { $exists: false } },
          { lastReminderSentAtUTC: { $lt: todayStart } },
        ],
      }).lean() as never;
    } catch (err) {
      logger.error(
        `[subscriptionExpiryCron] Failed to query reminders for day ${reminderDay}`,
        undefined,
        { error: String(err) },
      );
      continue;
    }

    logger.info(
      `[subscriptionExpiryCron] Reminder day=${reminderDay}: found ${subscriptionsToRemind.length} subscriptions`,
    );

    for (const sub of subscriptionsToRemind) {
      try {
        if (sub['lastReminderSentAtUTC']) {
          const lastSent = new Date(sub['lastReminderSentAtUTC'] as string);
          if (lastSent >= todayStart && lastSent <= todayEnd) {
            continue;
          }
        }

        const user = await User.findById(sub['userId']).select('full_name email phone_number').lean();
        const expiryDateStr = new Date(sub['expiresAtUTC'] as string).toISOString().split('T')[0];

        const vars: Record<string, string> = {
          expiry_date:  expiryDateStr,
          plan_name:    '',
          renewal_url:  process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/subscription` : '',
          student_name: user?.full_name ?? '',
        };

        try {
          await sendNotificationToStudent(sub['userId'] as never, templateKey, 'sms', vars);
        } catch (smsErr) {
          logger.warn(
            `[subscriptionExpiryCron] SMS reminder failed for userId=${sub['userId']}`,
            undefined,
            { error: String(smsErr) },
          );
        }

        try {
          await sendNotificationToStudent(sub['userId'] as never, templateKey, 'email', vars);
        } catch (emailErr) {
          logger.warn(
            `[subscriptionExpiryCron] Email reminder failed for userId=${sub['userId']}`,
            undefined,
            { error: String(emailErr) },
          );
        }

        await UserSubscription.findByIdAndUpdate(sub['_id'], {
          $set: { lastReminderSentAtUTC: now },
        });

        logger.info(
          `[subscriptionExpiryCron] Reminder sent to userId=${sub['userId']} templateKey=${templateKey}`,
        );
      } catch (err) {
        logger.error(
          `[subscriptionExpiryCron] Error processing reminder for sub._id=${sub['_id']}`,
          undefined,
          { error: String(err) },
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Expire overdue subscriptions
  // -------------------------------------------------------------------------
  if (!settings['autoExpireEnabled']) {
    logger.info('[subscriptionExpiryCron] autoExpireEnabled=false, skipping expiry step');
    return;
  }

  let overdueSubscriptions: Record<string, unknown>[] = [];
  try {
    overdueSubscriptions = await UserSubscription.find({
      status: 'active',
      expiresAtUTC: { $lte: now },
    }).lean() as never;
  } catch (err) {
    logger.error('[subscriptionExpiryCron] Failed to query overdue subscriptions', undefined, {
      error: String(err),
    });
    return;
  }

  logger.info(
    `[subscriptionExpiryCron] Found ${overdueSubscriptions.length} overdue subscriptions to expire`,
  );

  for (const sub of overdueSubscriptions) {
    try {
      await UserSubscription.findByIdAndUpdate(sub['_id'], {
        $set: { status: 'expired' },
      });
      logger.info(`[subscriptionExpiryCron] Expired subscription _id=${sub['_id']} userId=${sub['userId']}`);
    } catch (err) {
      logger.error(
        `[subscriptionExpiryCron] Failed to expire subscription _id=${sub['_id']}`,
        undefined,
        { error: String(err) },
      );
      continue;
    }

    try {
      const userUpdate: Record<string, unknown> = {
        'subscription.isActive': false,
      };

      if (settings['passwordResetOnExpiry']) {
        userUpdate['mustChangePassword']    = true;
        userUpdate['passwordResetRequired'] = true;
      }

      await User.findByIdAndUpdate(sub['userId'], { $set: userUpdate });
      logger.info(
        `[subscriptionExpiryCron] Updated user subscription.isActive=false for userId=${sub['userId']}`,
      );
    } catch (err) {
      logger.error(
        `[subscriptionExpiryCron] Failed to update user for subscription _id=${sub['_id']}`,
        undefined,
        { error: String(err) },
      );
    }

    try {
      const deleteResult = await ActiveSession.deleteMany({ user_id: sub['userId'] });
      logger.info(
        `[subscriptionExpiryCron] Revoked ${deleteResult.deletedCount} sessions for userId=${sub['userId']}`,
      );
    } catch (err) {
      logger.error(
        `[subscriptionExpiryCron] Failed to revoke sessions for userId=${sub['userId']}`,
        undefined,
        { error: String(err) },
      );
    }

    try {
      const expiryDateStr = new Date(sub['expiresAtUTC'] as string).toISOString().split('T')[0];
      const vars: Record<string, string> = {
        expiry_date: expiryDateStr,
        plan_name:   '',
      };

      try {
        await sendNotificationToStudent(sub['userId'] as never, 'SUB_EXPIRED', 'sms', vars);
      } catch { /* non-fatal */ }

      try {
        await sendNotificationToStudent(sub['userId'] as never, 'SUB_EXPIRED', 'email', vars);
      } catch { /* non-fatal */ }

      logger.info(
        `[subscriptionExpiryCron] SUB_EXPIRED notification dispatched for userId=${sub['userId']}`,
      );
    } catch (err) {
      logger.error(
        `[subscriptionExpiryCron] Failed to send SUB_EXPIRED notification for userId=${sub['userId']}`,
        undefined,
        { error: String(err) },
      );
    }
  }

  logger.info('[subscriptionExpiryCron] Run complete');

  // 4. Trigger automatic audience-based notifications for subscription state changes
  try {
    await triggerAutoSend('subscription_expired', 'system');
    logger.info('[subscriptionExpiryCron] triggerAutoSend(subscription_expired) dispatched');
  } catch (err) {
    logger.error('[subscriptionExpiryCron] triggerAutoSend failed', undefined, { error: String(err) });
  }
}

export function startSubscriptionExpiryCron(): void {
  // Daily at 01:00 UTC
  cron.schedule('0 1 * * *', async () => {
    try {
      await runSubscriptionExpiryCheck();
    } catch (err) {
      logger.error('[subscriptionExpiryCron] Unhandled error in cron run', undefined, {
        error: String(err),
      });
    }
  });
  logger.info('[subscriptionExpiryCron] Scheduled daily at 01:00 UTC');
}
