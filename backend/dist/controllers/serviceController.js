"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = getServices;
exports.getServiceDetails = getServiceDetails;
exports.getServiceBySlug = getServiceBySlug;
exports.adminGetServices = adminGetServices;
exports.adminCreateService = adminCreateService;
exports.adminUpdateService = adminUpdateService;
exports.adminDeleteService = adminDeleteService;
exports.adminReorderServices = adminReorderServices;
exports.adminToggleServiceStatus = adminToggleServiceStatus;
exports.adminToggleServiceFeatured = adminToggleServiceFeatured;
exports.adminGetAuditLogs = adminGetAuditLogs;
exports.adminGetPricingPlans = adminGetPricingPlans;
exports.adminCreatePricingPlan = adminCreatePricingPlan;
exports.adminUpdatePricingPlan = adminUpdatePricingPlan;
exports.adminDeletePricingPlan = adminDeletePricingPlan;
const Service_1 = __importDefault(require("../models/Service"));
const ServiceCategory_1 = __importDefault(require("../models/ServiceCategory"));
const ServicePricingPlan_1 = __importDefault(require("../models/ServicePricingPlan"));
const ServiceAuditLog_1 = __importDefault(require("../models/ServiceAuditLog"));
/* ═══════════════════════════════
   PUBLIC APIS
   ═══════════════════════════════ */
async function getServices(req, res) {
    try {
        const { category, q, page = '1', limit = '12', sort = 'display_order' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const filter = { is_active: true };
        // Handle category filter - matching by ObjectId
        if (category && category !== 'all') {
            filter.category = category;
        }
        // Handle search query across both languages
        if (q) {
            filter.$or = [
                { title_en: { $regex: q, $options: 'i' } },
                { title_bn: { $regex: q, $options: 'i' } },
                { description_en: { $regex: q, $options: 'i' } },
                { description_bn: { $regex: q, $options: 'i' } }
            ];
        }
        const services = await Service_1.default.find(filter)
            .sort(sort === 'featured' ? { is_featured: -1, display_order: 1 } : { display_order: 1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('category', 'name_en name_bn')
            .lean();
        const total = await Service_1.default.countDocuments(filter);
        res.json({
            services,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (err) {
        console.error('getServices error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getServiceDetails(req, res) {
    try {
        const service = await Service_1.default.findOne({ _id: req.params.id, is_active: true })
            .populate('category', 'name_en name_bn')
            .lean();
        if (!service) {
            res.status(404).json({ message: 'Service not found or inactive' });
            return;
        }
        res.json({ service });
    }
    catch (err) {
        console.error('getServiceDetails error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// Compatibility alias: existing callers may still import getServiceBySlug.
async function getServiceBySlug(req, res) {
    await getServiceDetails(req, res);
}
/* ═══════════════════════════════
   ADMIN APIS
   ═══════════════════════════════ */
async function adminGetServices(req, res) {
    try {
        const { is_active, category, page = '1', limit = '50' } = req.query;
        const parsedPage = parseInt(String(page), 10);
        const parsedLimit = parseInt(String(limit), 10);
        const pageNum = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;
        const filter = {};
        if (is_active !== undefined)
            filter.is_active = is_active === 'true';
        if (category && category !== 'all')
            filter.category = category;
        const rawServices = await Service_1.default.find(filter)
            .sort({ display_order: 1, createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
        const categoryIds = Array.from(new Set(rawServices
            .map((service) => {
            const categoryValue = service?.category;
            if (!categoryValue)
                return '';
            if (typeof categoryValue === 'string')
                return categoryValue;
            if (typeof categoryValue === 'object' && categoryValue._id)
                return String(categoryValue._id);
            return String(categoryValue);
        })
            .filter((id) => /^[a-f0-9]{24}$/i.test(id))));
        const categories = categoryIds.length
            ? await ServiceCategory_1.default.find({ _id: { $in: categoryIds } })
                .select('name_en name_bn')
                .lean()
            : [];
        const categoryMap = new Map(categories.map((item) => [String(item._id), { name_en: item.name_en, name_bn: item.name_bn }]));
        const services = rawServices.map((service) => {
            const categoryValue = service?.category;
            const categoryId = categoryValue
                ? (typeof categoryValue === 'string'
                    ? categoryValue
                    : typeof categoryValue === 'object' && categoryValue._id
                        ? String(categoryValue._id)
                        : String(categoryValue))
                : '';
            const mappedCategory = categoryId ? categoryMap.get(categoryId) : undefined;
            return {
                ...service,
                category: mappedCategory
                    ? { _id: categoryId, ...mappedCategory }
                    : (categoryValue && typeof categoryValue === 'object' && 'name_en' in categoryValue
                        ? categoryValue
                        : null),
            };
        });
        const total = await Service_1.default.countDocuments(filter);
        res.json({ services, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    }
    catch (err) {
        console.error('adminGetServices error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminCreateService(req, res) {
    try {
        const data = req.body;
        // Basic validation
        if (!data.title_bn || !data.title_en) {
            res.status(400).json({ message: 'Both English and Bangla titles are required' });
            return;
        }
        const service = await Service_1.default.create(data);
        res.status(201).json({ service, message: 'Service created successfully' });
    }
    catch (err) {
        console.error('adminCreateService err', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminUpdateService(req, res) {
    try {
        const data = req.body;
        const service = await Service_1.default.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        res.json({ service, message: 'Service updated successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminDeleteService(req, res) {
    try {
        const service = await Service_1.default.findByIdAndDelete(req.params.id);
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        res.json({ message: 'Service deleted permanently' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminReorderServices(req, res) {
    try {
        const { ids_in_order } = req.body;
        if (!Array.isArray(ids_in_order)) {
            res.status(400).json({ message: 'Invalid data format' });
            return;
        }
        const bulkOps = ids_in_order.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { display_order: index } }
            }
        }));
        await Service_1.default.bulkWrite(bulkOps);
        res.json({ message: 'Services reordered successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminToggleServiceStatus(req, res) {
    try {
        const service = await Service_1.default.findById(req.params.id);
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        service.is_active = !service.is_active;
        await service.save();
        res.json({ service, message: `Service is now ${service.is_active ? 'Active' : 'Inactive'}` });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminToggleServiceFeatured(req, res) {
    try {
        const service = await Service_1.default.findById(req.params.id);
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        service.is_featured = !service.is_featured;
        await service.save();
        res.json({ service, message: `Service is ${service.is_featured ? 'now Featured' : 'no longer Featured'}` });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetAuditLogs(req, res) {
    try {
        const serviceId = String(req.params.id || '').trim();
        if (!serviceId) {
            res.status(400).json({ message: 'Service id is required' });
            return;
        }
        const logs = await ServiceAuditLog_1.default.find({ service_id: serviceId })
            .populate('actor_id', 'full_name email')
            .sort({ timestamp: -1 })
            .lean();
        res.json({ logs });
    }
    catch (err) {
        console.error('adminGetAuditLogs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetPricingPlans(req, res) {
    try {
        const serviceId = String(req.params.id || '').trim();
        if (!serviceId) {
            res.status(400).json({ message: 'Service id is required' });
            return;
        }
        const plans = await ServicePricingPlan_1.default.find({ service_id: serviceId })
            .sort({ order_index: 1, createdAt: -1 })
            .lean();
        res.json({ plans });
    }
    catch (err) {
        console.error('adminGetPricingPlans error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminCreatePricingPlan(req, res) {
    try {
        const serviceId = String(req.params.id || '').trim();
        if (!serviceId) {
            res.status(400).json({ message: 'Service id is required' });
            return;
        }
        const payload = {
            ...req.body,
            service_id: serviceId,
        };
        if (!payload.name) {
            res.status(400).json({ message: 'Plan name is required' });
            return;
        }
        const plan = await ServicePricingPlan_1.default.create(payload);
        res.status(201).json({ plan, message: 'Pricing plan created successfully' });
    }
    catch (err) {
        console.error('adminCreatePricingPlan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminUpdatePricingPlan(req, res) {
    try {
        const serviceId = String(req.params.id || '').trim();
        const planId = String(req.params.planId || '').trim();
        if (!serviceId || !planId) {
            res.status(400).json({ message: 'Service id and plan id are required' });
            return;
        }
        const plan = await ServicePricingPlan_1.default.findOneAndUpdate({ _id: planId, service_id: serviceId }, req.body, { new: true, runValidators: true });
        if (!plan) {
            res.status(404).json({ message: 'Pricing plan not found' });
            return;
        }
        res.json({ plan, message: 'Pricing plan updated successfully' });
    }
    catch (err) {
        console.error('adminUpdatePricingPlan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminDeletePricingPlan(req, res) {
    try {
        const serviceId = String(req.params.id || '').trim();
        const planId = String(req.params.planId || '').trim();
        if (!serviceId || !planId) {
            res.status(400).json({ message: 'Service id and plan id are required' });
            return;
        }
        const plan = await ServicePricingPlan_1.default.findOneAndDelete({ _id: planId, service_id: serviceId });
        if (!plan) {
            res.status(404).json({ message: 'Pricing plan not found' });
            return;
        }
        res.json({ message: 'Pricing plan deleted successfully' });
    }
    catch (err) {
        console.error('adminDeletePricingPlan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=serviceController.js.map