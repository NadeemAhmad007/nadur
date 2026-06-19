import BrowsePage from '@/components/browse-page';
import { FaqSchema } from '@/components/schema-markup';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <FaqSchema />
      <BrowsePage />
    </>
  );
}
