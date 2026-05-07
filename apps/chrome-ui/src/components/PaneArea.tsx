import { UrlBar } from './UrlBar';

// PaneArea is the right side of the chrome. It hosts the URL bar at the top
// and a transparent placeholder where Electron positions tab WebContentsViews
// underneath. In subsequent slices, drop overlays + split dividers also
// render here, layered above the tab views.
export function PaneArea() {
  return (
    <main className="flex-1 flex flex-col bg-bg">
      <UrlBar />
      <div className="flex-1 bg-bg" />
    </main>
  );
}
