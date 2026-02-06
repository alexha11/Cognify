"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_1 = require("./prisma");
const config_2 = require("./config");
const auth_1 = require("./modules/auth");
const organizations_1 = require("./modules/organizations");
const courses_1 = require("./modules/courses");
const questions_1 = require("./modules/questions");
const attempts_1 = require("./modules/attempts");
const materials_1 = require("./modules/materials");
const ai_1 = require("./modules/ai");
const billing_1 = require("./modules/billing");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig],
                validationSchema: config_2.appConfigValidationSchema,
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: true,
                },
            }),
            prisma_1.PrismaModule,
            auth_1.AuthModule,
            organizations_1.OrganizationsModule,
            courses_1.CoursesModule,
            questions_1.QuestionsModule,
            attempts_1.AttemptsModule,
            materials_1.MaterialsModule,
            ai_1.AiModule,
            billing_1.BillingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map