function createOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Indonesia Regions API',
      version: '1.0.0',
      description: 'Authenticated API for Indonesian administrative region data.'
    },
    servers: [
      {
        url: '/',
        description: 'Current host'
      }
    ],
    tags: [
      {
        name: 'Health'
      },
      {
        name: 'Authentication'
      },
      {
        name: 'Regions'
      },
      {
        name: 'Admin'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        adminToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            }
          },
          required: ['error']
        },
        Province: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: '31'
            },
            name: {
              type: 'string',
              example: 'DKI JAKARTA'
            }
          },
          required: ['code', 'name']
        },
        City: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: '3174'
            },
            name: {
              type: 'string',
              example: 'KOTA ADMINISTRASI JAKARTA SELATAN'
            },
            province_code: {
              type: 'string',
              example: '31'
            }
          },
          required: ['code', 'name', 'province_code']
        },
        District: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: '317409'
            },
            name: {
              type: 'string',
              example: 'JAGAKARSA'
            },
            city_code: {
              type: 'string',
              example: '3174'
            }
          },
          required: ['code', 'name', 'city_code']
        },
        Village: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: '3174091001'
            },
            name: {
              type: 'string',
              example: 'JAGAKARSA'
            },
            district_code: {
              type: 'string',
              example: '317409'
            }
          },
          required: ['code', 'name', 'district_code']
        },
        DataResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          },
          required: ['data']
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns runtime, Supabase configuration, and region data readiness.',
          responses: {
            200: {
              description: 'Service status'
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign in',
          description: 'Signs in with Supabase email/password auth and returns a bearer token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email'
                    },
                    password: {
                      type: 'string',
                      format: 'password'
                    }
                  },
                  required: ['email', 'password']
                },
                example: {
                  email: 'user@example.com',
                  password: 'password'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Signed-in session'
            },
            401: {
              description: 'Invalid login credentials'
            },
            503: {
              description: 'Supabase Auth unavailable or not configured'
            }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Current user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Authenticated user'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/regions/metadata': {
        get: {
          tags: ['Regions'],
          summary: 'Region metadata',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Generation metadata'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/regions/provinces': {
        get: {
          tags: ['Regions'],
          summary: 'List provinces',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Province list'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/regions/cities': {
        get: {
          tags: ['Regions'],
          summary: 'List cities/regencies by province',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'province_code',
              in: 'query',
              required: true,
              schema: {
                type: 'string'
              },
              example: '31'
            }
          ],
          responses: {
            200: {
              description: 'City/regency list'
            },
            400: {
              description: 'province_code is required'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/regions/districts': {
        get: {
          tags: ['Regions'],
          summary: 'List districts by city/regency',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'city_code',
              in: 'query',
              required: true,
              schema: {
                type: 'string'
              },
              example: '3174'
            }
          ],
          responses: {
            200: {
              description: 'District list'
            },
            400: {
              description: 'city_code is required'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/regions/villages': {
        get: {
          tags: ['Regions'],
          summary: 'List villages by district',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'district_code',
              in: 'query',
              required: true,
              schema: {
                type: 'string'
              },
              example: '317409'
            }
          ],
          responses: {
            200: {
              description: 'Village list'
            },
            400: {
              description: 'district_code is required'
            },
            401: {
              description: 'Authentication required'
            }
          }
        }
      },
      '/api/admin/regions/regenerate': {
        post: {
          tags: ['Admin'],
          summary: 'Regenerate region data',
          description: 'Server-side regeneration from the configured source. Requires an admin token.',
          security: [{ adminToken: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    all: {
                      type: 'boolean'
                    },
                    province_codes: {
                      oneOf: [
                        {
                          type: 'array',
                          items: {
                            type: 'string'
                          }
                        },
                        {
                          type: 'string'
                        }
                      ]
                    },
                    concurrency: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 16,
                      default: 8
                    }
                  }
                },
                examples: {
                  selectedProvince: {
                    value: {
                      province_codes: ['31'],
                      concurrency: 8
                    }
                  },
                  allProvinces: {
                    value: {
                      all: true,
                      concurrency: 8
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Generated and validated'
            },
            400: {
              description: 'Invalid request'
            },
            401: {
              description: 'Unauthorized'
            },
            503: {
              description: 'Admin token is not configured'
            }
          }
        }
      }
    }
  };
}

module.exports = {
  createOpenApiSpec
};
