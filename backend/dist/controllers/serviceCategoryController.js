"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.adminGetCategories = adminGetCategories;
exports.adminCreateCategory = adminCreateCategory;
exports.adminUpdateCategory = adminUpdateCategory;
exports.adminDeleteCategory = adminDeleteCategory;
const ServiceCategory_1 = __importDefault(require("../models/ServiceCategory"));
async function getCategories(req, res) {
    try {
        const categories = await ServiceCategory_1.default.find({ status: 'active' })
            .sort({ order_index: 1 })
            .select('-__v')
            .lean();
        res.json({ categories });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetCategories(req, res) {
    try {
        const categories = await ServiceCategory_1.default.find()
            .sort({ order_index: 1 })
            .select('-__v')
            .lean();
        res.json({ categories });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminCreateCategory(req, res) {
    try {
        const { name_bn, name_en, status, order_index } = req.body;
        if (!name_bn || !name_en) {
            res.status(400).json({ message: 'Both English and Bangla names are required' });
            return;
        }
        const category = await ServiceCategory_1.default.create({ name_bn, name_en, status, order_index });
        res.status(201).json({ category, message: 'Category created successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminUpdateCategory(req, res) {
    try {
        const { name_bn, name_en, status, order_index } = req.body;
        const category = await ServiceCategory_1.default.findByIdAndUpdate(req.params.id, { name_bn, name_en, status, order_index }, { new: true, runValidators: true });
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json({ category, message: 'Category updated successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminDeleteCategory(req, res) {
    try {
        const category = await ServiceCategory_1.default.findByIdAndDelete(req.params.id);
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        // TODO: We might want to remove this category from affected services, or prevent deletion if services exist.
        // For now, simple delete:
        res.json({ message: 'Category deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=serviceCategoryController.js.map