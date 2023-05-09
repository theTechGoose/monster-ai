import { Test } from '@nestjs/testing';

export async function getService<T>(Service: any): Promise<T> {

    const app = await Test.createTestingModule({
      providers: [Service],
    }).compile();

    return app.get(Service);
}
