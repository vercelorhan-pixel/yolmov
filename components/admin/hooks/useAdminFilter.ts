import { useState, useMemo } from 'react';

interface FilterOptions<T> {
  searchKeys: (keyof T)[];
  statusKey?: keyof T;
}

export function useAdminFilter<T extends Record<string, any>>(items: T[], options: FilterOptions<T>) {
  const { searchKeys, statusKey } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    return items.filter(item => {
      // Status filter
      if (statusKey && filterType !== 'all') {
        if (String(item[statusKey]) !== filterType) return false;
      }
      // Search filter across keys
      if (searchTerm.trim() === '') return true;
      const lower = searchTerm.toLowerCase();
      return searchKeys.some(key => String(item[key]).toLowerCase().includes(lower));
    });
  }, [items, searchTerm, filterType, statusKey, searchKeys]);

  return {
    filtered,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType
  };
}
