import React from "react";

/**
 * MapTab — wraps CommunityMapTab component
 */
const MapTab = ({
  activeProjects,
  liveCommunityROI,
  setTab,
  TabSources,
  CommunityMapTab,
}) => {
  return (
    <>
      <CommunityMapTab
        activeProjects={activeProjects}
        liveCommunityROI={liveCommunityROI}
        setTab={setTab}
      />
      <TabSources sources={[
        { label: "Google Maps API", url: "https://maps.google.com" },
        { label: "Emaar Community Boundaries" },
        { label: "DLD Zoning Data", url: "https://dubailand.gov.ae" },
        { label: "OpenStreetMap", url: "https://www.openstreetmap.org" },
      ]} />
    </>
  );
};

export default MapTab;
