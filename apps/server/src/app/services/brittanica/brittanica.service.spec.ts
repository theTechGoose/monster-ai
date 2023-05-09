import { Test, TestingModule } from '@nestjs/testing';
import { BrittanicaService } from './brittanica.service';

describe('BrittanicaService', () => {
  let service: BrittanicaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrittanicaService],
    }).compile();

    service = module.get<BrittanicaService>(BrittanicaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
