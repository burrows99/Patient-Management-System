import { Global, Module } from '@nestjs/common';
import { Provider } from '@nestjs/common';
import { newEnforcer, newModelFromString } from 'casbin';
import TypeORMAdapter from 'typeorm-adapter';

export const CASBIN_ENFORCER = 'CASBIN_ENFORCER';

const casbinProvider: Provider = {
  provide: CASBIN_ENFORCER,
  useFactory: async () => {
    const adapter = await TypeORMAdapter.newAdapter({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'patient_mgmt',
      synchronize: true,
    } as any);

    const model = `
    [request_definition]
    r = sub, obj, act

    [policy_definition]
    p = sub, obj, act

    [role_definition]
    g = _, _

    [policy_effect]
    e = some(where (p.eft == allow))

    [matchers]
    m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
    `;

    const enforcer = await newEnforcer(newModelFromString(model), adapter);

    // Seed basic RBAC: doctor can manage patients; patient can read self
    await enforcer.addPolicy('doctor', 'patients', 'manage');
    await enforcer.addPolicy('patient', 'self', 'read');

    return enforcer;
  },
};

@Global()
@Module({
  providers: [casbinProvider],
  exports: [casbinProvider],
})
export class CasbinModule {}
