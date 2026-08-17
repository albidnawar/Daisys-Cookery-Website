import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { listFeaturedCakes, listFlavors } from "@/lib/catalog/queries";
import { FIXTURE_CAKES, FIXTURE_FLAVORS } from "@/lib/catalog/fixtures";

const VALUE_PROPS = [
  {
    title: "Collect from the shop",
    body: "Ready from 9am on the day you choose. Boxed, ribboned, carried out cold.",
  },
  {
    title: "Delivered locally",
    body: "Two-hour windows inside the city. We hand it to a person, never a doorstep.",
  },
  {
    title: "Custom & tiered",
    body: "A deposit holds the date. Anything above five pounds we quote on the phone first.",
  },
];

async function getHomeData() {
  if (!isSupabaseConfigured()) {
    return { flavors: FIXTURE_FLAVORS, cakes: FIXTURE_CAKES };
  }
  const supabase = await createServerSupabaseClient();
  const [flavors, cakes] = await Promise.all([
    listFlavors(supabase),
    listFeaturedCakes(supabase, 4),
  ]);
  return { flavors, cakes };
}

export default async function Home() {
  const { flavors, cakes } = await getHomeData();

  return (
    <div className="flex flex-col gap-16 pb-24">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 sm:px-8 md:grid-cols-2 md:items-center md:pt-20">
        <div className="flex flex-col gap-5">
          <Badge variant="mint">Baked to order since 2022</Badge>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-brand-chocolate sm:text-6xl">
            Cakes by the pound, one to two hundred.
          </h1>
          <p className="max-w-md font-body text-lg leading-relaxed text-brand-chocolate/80">
            Eleven flavors, sponge baked the morning you collect it. Tell us
            the size, the filling and what to write on top — we will do the
            rest by hand.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/customise/new" variant="primary">
              Build your cake
            </LinkButton>
            <LinkButton href="/browse" variant="ghost">
              Browse the flavors
            </LinkButton>
          </div>
          <p className="font-body text-sm text-brand-chocolate/60">
            Cakes over five pounds are quoted by phone — call 01814438989.
          </p>
        </div>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white shadow-brand">
          <Image
            src="/next.svg"
            alt="Placeholder hero cake photograph"
            fill
            className="object-contain p-16 opacity-30"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-8">
        <p className="mb-4 font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          Eleven flavors
        </p>
        <div className="flex flex-wrap gap-2">
          {flavors.map((flavor) => (
            <Link
              key={flavor.slug}
              href={`/browse?flavor=${flavor.slug}`}
              className="inline-flex items-center rounded-full bg-pink px-3 py-1 font-body text-xs font-bold tracking-wide text-brand-chocolate hover:bg-brand-orange hover:text-white"
            >
              {flavor.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-semibold text-brand-chocolate">
            Shop by flavor
          </h2>
          <LinkButton href="/browse" variant="ghost" className="px-3 py-1 text-sm">
            See all eleven
          </LinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cakes.map((cake) => (
            <Card key={cake.id} className="flex flex-col gap-3 p-4">
              <Link href={`/cakes/${cake.slug}`} className="contents">
                <div className="aspect-4/3 rounded-2xl bg-cream" />
                {cake.flavor && <Badge variant="chocolate">{cake.flavor.name}</Badge>}
                <p className="font-display text-xl font-medium text-brand-chocolate">
                  {cake.name}
                </p>
                <p className="font-body text-sm text-brand-chocolate/70">
                  ৳{cake.basePrice.toLocaleString("en-BD")} / lb
                </p>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-8 md:grid-cols-3">
        {VALUE_PROPS.map((prop) => (
          <div key={prop.title}>
            <p className="mb-2 font-display text-xl font-medium text-brand-chocolate">
              {prop.title}
            </p>
            <p className="font-body text-sm leading-relaxed text-brand-chocolate/70">
              {prop.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
