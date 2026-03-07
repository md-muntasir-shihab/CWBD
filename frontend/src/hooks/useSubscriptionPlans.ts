import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    adminAssignSubscriptionPlan,
    adminCreateSubscriptionPlan,
    adminDeleteSubscriptionPlan,
    adminGetSubscriptionPlans,
    adminReorderSubscriptionPlans,
    adminSuspendSubscriptionPlan,
    adminToggleSubscriptionPlan,
    adminUpdateSubscriptionPlan,
    getMySubscriptionStatus,
    getPublicSubscriptionPlanById,
    getPublicSubscriptionPlans,
    requestSubscriptionPayment,
    type AdminSubscriptionPlan,
    type SubscriptionAssignmentPayload,
    type SubscriptionPlanPublic,
    type UserSubscriptionStatus,
} from '../services/api';
import { invalidateQueryGroup, invalidationGroups, queryKeys } from '../lib/queryKeys';

export const subscriptionQueryKeys = {
    publicPlans: queryKeys.plansPublicLegacy,
    publicPlanById: (id: string) => ['public-subscription-plan', id] as const,
    mySubscription: queryKeys.studentMeLegacy,
    adminPlans: queryKeys.plansAdminLegacy,
};

function normalizePlan(plan: SubscriptionPlanPublic): SubscriptionPlanPublic {
    const priceBDT = Number(plan.priceBDT ?? plan.price ?? 0);
    const durationDays = Number(plan.durationDays ?? plan.durationValue ?? 30);
    const displayOrder = Number(plan.displayOrder ?? plan.sortOrder ?? plan.priority ?? 100);
    const enabled = plan.enabled ?? plan.isActive ?? true;
    const type = plan.type || (priceBDT <= 0 ? 'free' : 'paid');

    return {
        ...plan,
        type,
        priceBDT: Math.max(0, priceBDT),
        price: Math.max(0, Number(plan.price ?? priceBDT)),
        durationDays: Math.max(1, durationDays),
        durationValue: Math.max(1, Number(plan.durationValue ?? durationDays)),
        durationUnit: plan.durationUnit === 'months' ? 'months' : 'days',
        enabled,
        isActive: enabled,
        displayOrder,
        sortOrder: Number(plan.sortOrder ?? displayOrder),
        priority: Number(plan.priority ?? displayOrder),
        features: Array.isArray(plan.features) ? plan.features : [],
        includedModules: Array.isArray(plan.includedModules) ? plan.includedModules : [],
        tags: Array.isArray(plan.tags) ? plan.tags : [],
        contactCtaLabel: plan.contactCtaLabel || 'Contact to Subscribe',
        contactCtaUrl: plan.contactCtaUrl || '/contact',
    };
}

export function useSubscriptionPlans() {
    return useQuery({
        queryKey: subscriptionQueryKeys.publicPlans,
        queryFn: async (): Promise<SubscriptionPlanPublic[]> => {
            const response = await getPublicSubscriptionPlans();
            return (response.data.items || [])
                .map(normalizePlan)
                .sort((a, b) => (a.displayOrder || 100) - (b.displayOrder || 100));
        },
    });
}

export function useSubscriptionPlanById(planId: string) {
    return useQuery({
        queryKey: subscriptionQueryKeys.publicPlanById(planId),
        enabled: Boolean(planId),
        queryFn: async (): Promise<SubscriptionPlanPublic | null> => {
            if (!planId) return null;
            const response = await getPublicSubscriptionPlanById(planId);
            return normalizePlan(response.data.item);
        },
    });
}

export function useMySubscription(enabled = true) {
    return useQuery({
        queryKey: subscriptionQueryKeys.mySubscription,
        enabled,
        queryFn: async (): Promise<UserSubscriptionStatus> => {
            const response = await getMySubscriptionStatus();
            return response.data;
        },
    });
}

export function useAdminSubscriptionPlans() {
    return useQuery({
        queryKey: subscriptionQueryKeys.adminPlans,
        queryFn: async (): Promise<AdminSubscriptionPlan[]> => {
            const response = await adminGetSubscriptionPlans();
            return (response.data.items || [])
                .map((plan) => normalizePlan(plan))
                .sort((a, b) => (a.displayOrder || 100) - (b.displayOrder || 100));
        },
    });
}

function useSubscriptionPlanInvalidator() {
    const queryClient = useQueryClient();
    return async () => {
        await invalidateQueryGroup(queryClient, invalidationGroups.plansSave);
    };
}

export function useCreateSubscriptionPlanMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (payload: Partial<AdminSubscriptionPlan>) => adminCreateSubscriptionPlan(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateSubscriptionPlanMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminSubscriptionPlan> }) =>
            adminUpdateSubscriptionPlan(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteSubscriptionPlanMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (id: string) => adminDeleteSubscriptionPlan(id),
        onSuccess: invalidate,
    });
}

export function useToggleSubscriptionPlanMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (id: string) => adminToggleSubscriptionPlan(id),
        onSuccess: invalidate,
    });
}

export function useReorderSubscriptionPlansMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (order: string[]) => adminReorderSubscriptionPlans(order),
        onSuccess: invalidate,
    });
}

export function useAssignSubscriptionMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (payload: SubscriptionAssignmentPayload) => adminAssignSubscriptionPlan(payload),
        onSuccess: invalidate,
    });
}

export function useSuspendSubscriptionMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: (payload: { userId: string; notes?: string }) => adminSuspendSubscriptionPlan(payload),
        onSuccess: invalidate,
    });
}

export function useRequestSubscriptionPaymentMutation() {
    const invalidate = useSubscriptionPlanInvalidator();
    return useMutation({
        mutationFn: ({ planId, method }: { planId: string; method?: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash' | 'manual' | 'bank' | 'card' | 'sslcommerz' }) =>
            requestSubscriptionPayment(planId, { method }),
        onSuccess: invalidate,
    });
}
