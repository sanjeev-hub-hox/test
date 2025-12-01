import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CommunicationModeService } from './communication_mode.service';
import { CommunicationMode } from './communication_mode.schema';

@Controller('communication-modes')
export class CommunicationModeController {
  constructor(private readonly communicationModeService: CommunicationModeService) {}

  @Post()
  create(@Body() data: Partial<CommunicationMode>): Promise<CommunicationMode> {
    return this.communicationModeService.create(data);
  }

  @Get()
  async findAll(): Promise<CommunicationMode[]> {
    const modes = await this.communicationModeService.findAll();
    return modes;
  }
}
