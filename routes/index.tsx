

export default function Home() {
  return (
    <div class="h-screen w-full text-neutral-800 font-magic grid place-content-center">
      <div class="flex flex-col gap-4">
        {["mxGraph"].map(name => {return(
          <div class="p-1 border lounded-lg bg-nutral-100 hover:bg-neutral-200 cursor-pointer">
            <a href={`/page/${name}`}>{name}</a>
          </div>
        )})}
      </div>
    </div>
  );
}
