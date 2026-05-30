import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

// Extrae el usuario autenticado de la request
// Uso: @GetUser() user: User  |  @GetUser('email') email: string
export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (data) {
      return user[data];
    }

    return user;
  },
);
