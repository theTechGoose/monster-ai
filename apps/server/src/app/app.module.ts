import { Module } from '@nestjs/common';
import { AmiDbController } from './ami/controllers/ami-db/ami-db.controller';
import { AmiDbService } from './ami/ai-backend/services/ami-db/ami-db.service';
import { VersionService } from './ami/ai-backend/services/version/version.service';

export const providers = [AmiDbService, VersionService];

@Module({
  imports: [],
  controllers: [AmiDbController],
  providers,
})
export class AppModule {}
