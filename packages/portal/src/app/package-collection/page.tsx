import Protected from '../guard';
import PackageCollection from './package-collection';

export default function PackageCollectionPage() {
  return (
    <Protected>
      <PackageCollection />
    </Protected>
  );
}
