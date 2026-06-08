import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';

export function usePaginatedList(fetchFn, initialFilters = {}, deps = []) {
  const { locale } = useLocale();
  const [filters, setFilters] = useState({
    page: 1,
    size: 10,
    ...initialFilters,
  });
  const [data, setData] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    totalPages: 0,
    totalElements: 0,
    number: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchFn(filters, locale);
      const page = res?.data || {};
      setData(page.content || []);
      setPageInfo({
        totalPages: page.totalPages ?? 0,
        totalElements: page.totalElements ?? 0,
        number: (page.number ?? 0) + 1,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, filters, locale, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  };

  const setPage = (page) => setFilter('page', page);

  const resetFilters = () => {
    setFilters({ page: 1, size: 10, ...initialFilters });
  };

  return {
    data,
    filters,
    pageInfo,
    loading,
    error,
    setFilter,
    setPage,
    setFilters,
    resetFilters,
    reload: load,
  };
}
