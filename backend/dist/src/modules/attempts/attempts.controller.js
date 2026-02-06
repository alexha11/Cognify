"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsController = void 0;
const common_1 = require("@nestjs/common");
const attempts_service_1 = require("./attempts.service");
const dto_1 = require("./dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
let AttemptsController = class AttemptsController {
    attemptsService;
    constructor(attemptsService) {
        this.attemptsService = attemptsService;
    }
    async create(dto, user) {
        return this.attemptsService.create(dto, user.userId, user.organizationId);
    }
    async findMyAttempts(user) {
        return this.attemptsService.findByUser(user.userId);
    }
    async getStats(user) {
        return this.attemptsService.getOverallStats(user.userId, user.organizationId);
    }
    async getCourseProgress(courseId, user) {
        return this.attemptsService.getCourseProgress(courseId, user.userId, user.organizationId);
    }
};
exports.AttemptsController = AttemptsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAttemptDto, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "findMyAttempts", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "getCourseProgress", null);
exports.AttemptsController = AttemptsController = __decorate([
    (0, common_1.Controller)('attempts'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __metadata("design:paramtypes", [attempts_service_1.AttemptsService])
], AttemptsController);
//# sourceMappingURL=attempts.controller.js.map