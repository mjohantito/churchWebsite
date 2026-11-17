import { Hero } from '../sections/Hero';
import { Services } from '../sections/Services';
import { Sermon } from '../sections/Sermon';
import { Ministries } from '../sections/Ministries';

export function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Sermon />
      <Ministries />
    </>
  );
}
