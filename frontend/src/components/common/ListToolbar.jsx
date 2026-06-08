import SearchBar from './SearchBar';
import FilterSelect from './FilterSelect';

export default function ListToolbar({
  keyword,
  onKeywordChange,
  onSearch,
  filters = [],
  extra,
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 border-b border-stone-200 bg-white">
      <SearchBar
        value={keyword}
        onChange={onKeywordChange}
        onSubmit={onSearch}
      />
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((f) => (
          <FilterSelect
            key={f.key}
            label={f.label}
            value={f.value}
            onChange={f.onChange}
            options={f.options}
            allLabel={f.allLabel}
          />
        ))}
        {extra}
      </div>
    </div>
  );
}
