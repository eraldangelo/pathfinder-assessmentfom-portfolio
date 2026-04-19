import { getPublicRuntimeEnv } from '../../lib/config/publicRuntimeEnv.server';

const serialize = (value: unknown) => encodeURIComponent(JSON.stringify(value));

export default function PublicEnvScript() {
  const env = getPublicRuntimeEnv();
  return <meta name="assessment-public-env" content={serialize(env)} />;
}
