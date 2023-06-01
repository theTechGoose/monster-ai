import { Test, TestingModule } from '@nestjs/testing';
import { AmiDbController } from './ami-db.controller';

describe('AmiDbController', () => {
  let controller: AmiDbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmiDbController],
    }).compile();

    controller = module.get<AmiDbController>(AmiDbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
