import 'dotenv/config'
import { Test } from '@nestjs/testing';
import {providers} from "../app/app.module"

export async function getService<T>(Service: any): Promise<T> {
    const app = await Test.createTestingModule({
      providers,
    }).compile();

    return app.get(Service);
}
