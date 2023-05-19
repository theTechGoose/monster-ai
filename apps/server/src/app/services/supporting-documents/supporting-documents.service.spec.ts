import { Test, TestingModule } from '@nestjs/testing';
import { SupportingDocumentsService } from './supporting-documents.service';

describe('SupportingDocumentsService', () => {
  let service: SupportingDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportingDocumentsService],
    }).compile();

    service = module.get<SupportingDocumentsService>(
      SupportingDocumentsService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
