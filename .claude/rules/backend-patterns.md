# Backend Patterns (NestJS + Drizzle)

## NestJS Module Authoring

### Static Module (simple, no configuration)

```typescript
@Module({
  imports: [OpenKingdomDataAccessBackendUsersModule],
  providers: [MyService],
  controllers: [MyController],
  exports: [MyService],
})
export class MyFeatureModule {}
```

### Dynamic Module (requires configuration)

```typescript
export interface MyModuleOptions {
  requiredSetting: string;
  optionalSetting?: number; // default: 10
}

@Module({})
export class MyFeatureModule {
  static forRoot(options: MyModuleOptions): DynamicModule {
    return {
      module: MyFeatureModule,
      imports: [...],
      providers: [
        { provide: MY_OPTIONS_TOKEN, useValue: options },
        MyService,
      ],
      controllers: [MyController],
      exports: [MyService],
    };
  }
}

// Injection token
export const MY_OPTIONS_TOKEN = 'MY_OPTIONS_TOKEN';
```

### Consuming Dynamic Module Options in a Service

```typescript
@Injectable()
export class MyService {
  constructor(
    @Inject(MY_OPTIONS_TOKEN)
    private readonly options: MyModuleOptions
  ) {}
}
```

## Database Access with Drizzle

### Inject the Database

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

@Injectable()
export class MyService {
  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<typeof schema>
  ) {}

  async findAll() {
    return this.db.select().from(schema.myTable).all();
  }

  async create(data: typeof schema.myTable.$inferInsert) {
    return this.db.insert(schema.myTable).values(data).returning().get();
  }
}
```

### Defining a Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const myTable = sqliteTable('my_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  status: text('status', { enum: ['active', 'inactive'] }).default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export inferred types
export type MyRecord = typeof myTable.$inferSelect;
export type NewMyRecord = typeof myTable.$inferInsert;
```

## Authentication Patterns

### Protecting All Routes (Global Guard)

```typescript
// In AppModule providers:
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

### Marking a Route as Public

```typescript
import { Public } from '@open-kingdom/shared-backend-feature-authentication';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) { ... }
}
```

### Accessing the Authenticated User

```typescript
import { AuthenticatedRequest } from '@open-kingdom/shared-backend-feature-user-management';

@Get('profile')
getProfile(@Req() req: AuthenticatedRequest) {
  const { id, email } = req.user;
  return this.usersService.findById(id);
}
```

## DTOs and Validation

Use class-validator with Swagger decorators on all DTOs:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
```

Enable global validation pipe in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

## Error Handling

- Use NestJS built-in HTTP exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`
- Services throw domain exceptions; controllers let them propagate

## Environment Configuration

Use `ConfigService` from `@open-kingdom/shared-poly-util-env-config`:

```typescript
import { createConfigService, nodeEnvAdapter } from '@open-kingdom/shared-poly-util-env-config';

const config = createConfigService(['PORT', 'JWT_SECRET', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'] as const, nodeEnvAdapter);

// In module bootstrap (main.ts):
const port = config.get('PORT', '3000');
const jwtSecret = config.getOrThrow('JWT_SECRET');
```

## API Documentation

All controllers and their DTOs should use `@nestjs/swagger` decorators:

- `@ApiTags('tag-name')` on controller
- `@ApiOperation({ summary: '...' })` on each endpoint
- `@ApiResponse({ status: 200, type: ResponseDto })` for typed responses
- `@ApiBearerAuth()` on protected endpoints

Generate OpenAPI spec: `npm run swagger:generate-all`
