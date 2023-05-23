import { Test, TestingModule } from '@nestjs/testing';
import { AmiBrittanicaService } from './ami-brittanica.service';

describe('AmiBrittanicaService', () => {
  let service: AmiBrittanicaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmiBrittanicaService],
    }).compile();

    service = module.get<AmiBrittanicaService>(AmiBrittanicaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
