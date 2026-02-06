import * as Joi from 'joi';
import { AppConfig } from './config.interface';
export declare const appConfigValidationSchema: Joi.ObjectSchema<any>;
export declare const appConfig: (() => AppConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfig>;
