import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TemplateSchema } from "./template.schema";
import { TemplateRepository } from "./template.repository";
import { TemplateController } from "./template.controller";
import { TemplateService } from "./template.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'template', schema: TemplateSchema }
        ])
    ],
    providers: [TemplateRepository, TemplateService],
    exports: [TemplateRepository, TemplateService],
    controllers: [TemplateController]
})
export class TemplateModule {

}