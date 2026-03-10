import { useParams } from 'react-router-dom';
import UniversityBrowseShell from '../components/university/UniversityBrowseShell';

function unslug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UniversityClusterBrowsePage() {
    const { clusterSlug } = useParams<{ clusterSlug: string }>();
    const clusterName = unslug(clusterSlug || '');

    return (
        <UniversityBrowseShell
            fixedCluster={clusterName}
            title={clusterName || 'Cluster'}
            subtitle={`Showing all universities in ${clusterName || 'this cluster'}.`}
            hideCategoryTabs
        />
    );
}
