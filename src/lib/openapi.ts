export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "HelpDesk API",
    description: "Customer support ticketing system with role-based access control",
    version: "1.0.0",
    contact: {
      name: "HelpDesk Support",
      email: "support@helpdesk.example.com",
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      description: "Current environment",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "hd_access",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "agent", "customer"] },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "integer" },
          subject: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["open", "in_progress", "resolved", "closed"],
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          customer_id: { type: "integer" },
          customer_name: { type: "string" },
          assignee_id: { type: "integer", nullable: true },
          assignee_name: { type: "string", nullable: true },
          category_id: { type: "integer", nullable: true },
          category_name: { type: "string", nullable: true },
          resolved_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          ticket_id: { type: "integer" },
          author_id: { type: "integer" },
          author_name: { type: "string" },
          body: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Login",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register new customer",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registration successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout",
        tags: ["Authentication"],
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { logged_out: { type: "boolean" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current user",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/tickets": {
      get: {
        summary: "List tickets",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 20 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
          },
          {
            name: "priority",
            in: "query",
            schema: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "List of tickets",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Ticket" },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    per_page: { type: "integer" },
                    pages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create ticket",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "description"],
                properties: {
                  subject: { type: "string", minLength: 3, maxLength: 200 },
                  description: { type: "string", minLength: 10 },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                  },
                  category_id: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Ticket created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
        },
      },
    },
    "/api/tickets/{id}": {
      get: {
        summary: "Get ticket",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Ticket details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
          "404": { description: "Ticket not found" },
        },
      },
      patch: {
        summary: "Update ticket",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  category_id: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Ticket updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete ticket (admin only)",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Ticket deleted" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/tickets/{id}/status": {
      post: {
        summary: "Change ticket status",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["open", "in_progress", "resolved", "closed"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status changed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
          "422": {
            description: "Invalid state transition",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/tickets/{id}/assign": {
      post: {
        summary: "Assign ticket (admin only)",
        tags: ["Tickets"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["assignee_id"],
                properties: {
                  assignee_id: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Ticket assigned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
        },
      },
    },
    "/api/tickets/{id}/comments": {
      get: {
        summary: "List comments",
        tags: ["Comments"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "per_page", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "List of comments",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Comment" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Add comment",
        tags: ["Comments"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["body"],
                properties: {
                  body: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Comment added",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Comment" },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        summary: "List users (admin only)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create user (admin only)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  role: { type: "string", enum: ["admin", "agent", "customer"] },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}": {
      patch: {
        summary: "Update user (admin only)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["admin", "agent", "customer"] },
                  is_active: { type: "boolean" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete user (admin only)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "User deleted" },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "List categories",
        tags: ["Categories"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create category (admin only)",
        tags: ["Categories"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Category created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Category" },
              },
            },
          },
        },
      },
    },
    "/api/categories/{id}": {
      patch: {
        summary: "Update category (admin only)",
        tags: ["Categories"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Category updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Category" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete category (admin only)",
        tags: ["Categories"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Category deleted" },
        },
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Get dashboard stats (agent/admin)",
        tags: ["Dashboard"],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    by_status: { type: "object" },
                    by_priority: { type: "object" },
                    resolved_today: { type: "integer" },
                    unassigned_open: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/cron/daily-digest": {
      get: {
        summary: "Daily digest cron job",
        tags: ["Cron"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Digest sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    sentTo: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};