import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/modules/prisma/prisma.service'

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}
}
