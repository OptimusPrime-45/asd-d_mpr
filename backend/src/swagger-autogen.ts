import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'FleetOps API',
    description: 'Automatically generated Swagger docs for the FleetOps transport operations platform'
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = '../swagger-output.json';
const endpointsFiles = ['./routes/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
