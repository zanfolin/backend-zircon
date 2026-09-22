export const buildPaginatedResponse = ({
  message,
  collectionKey,
  data,
  page,
  limit,
  total,
}) => {
  const currentPage = Number(page) || 1;
  const pageSize = Number(limit) || data.length || 0;
  const totalItems = Number(total) || 0;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return {
    success: true,
    message,
    data: {
      [collectionKey]: data,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total: totalItems,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    },
  };
};
