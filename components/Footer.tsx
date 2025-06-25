export default function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 font-bold text-xl mb-2">
            <span>Headshots AI MVP</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional AI-generated headshots.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} Headshots AI MVP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
