export default function Loading() {
  return (
    <div className="configurator" aria-busy="true" aria-label="Loading mattresses">
      <div className="skeleton skeleton--title configurator__title" />
      <div className="skeleton skeleton--select configurator__select" />
      <div className="configurator__media skeleton" />
      <div className="configurator__details">
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--button" />
      </div>
    </div>
  )
}
