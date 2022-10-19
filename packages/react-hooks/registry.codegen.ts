// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';

dotenv.config();

const config: CodegenConfig = {
  schema: process.env.KEPLER_SUBQL,
  documents: '../../node_modules/@subql/network-query/queries/registry/*.gql',
  config: {
    preResolveTypes: true,
    namingConvention: 'keep',
    avoidOptionals: true,
    nonOptionalTypename: true,
    skipTypeNameForRoot: true,
    immutableTypes: true,
    scalars: {
      Date: 'Date',
      Datetime: 'Date',
      BigFloat: 'bigint' || 'string',
      BigInt: 'bigint',
      Cursor: 'string',
    },
  },
  generates: {
    'src/': {
      preset: 'near-operation-file',
      presetConfig: {
        folder: '../../../../../packages/react-hooks/src/__hooks__/registry', // defines a folder, (Relative to the source files) where the generated files will be created
        extensions: '.generated.ts',
        baseTypesPath: 'types',
      },
      config: {
        importOperationTypesFrom: 'Types.Registry',
      },
      plugins: ['typescript-react-apollo'],
    },
  },
};

export default config;
