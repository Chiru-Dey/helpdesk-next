export interface PaginationInput {
  page: number;
  per_page: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export function buildMeta(total: number, input: PaginationInput): PaginationMeta {
  return {
    total,
    page: input.page,
    per_page: input.per_page,
    pages: input.per_page > 0 ? Math.ceil(total / input.per_page) : 0,
  };
}

export function offset(input: PaginationInput): number {
  return (input.page - 1) * input.per_page;
}