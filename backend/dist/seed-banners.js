"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Banner_1 = __importDefault(require("./models/Banner"));
dotenv_1.default.config();
async function seed() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    console.log('Seeding banners...');
    const banners = [
        {
            title: 'Welcome to CampusWay',
            subtitle: 'Your ultimate guide to university admissions in Bangladesh',
            imageUrl: 'https://images.unsplash.com/photo-1523050335392-9ae824979603?q=80&w=1200',
            linkUrl: '/universities',
            isActive: true,
            order: 0
        },
        {
            title: 'Upcoming Admission Exams',
            subtitle: 'Check out the schedule for engineering and medical universities',
            imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200',
            linkUrl: '/exams',
            isActive: true,
            order: 1
        }
    ];
    await Banner_1.default.deleteMany({});
    await Banner_1.default.insertMany(banners);
    console.log('✅ Banners seeded successfully');
    await mongoose_1.default.disconnect();
}
seed();
//# sourceMappingURL=seed-banners.js.map