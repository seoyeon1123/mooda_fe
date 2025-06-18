import NavBar from "@/components/common/NavBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-auto min-h-0">{children}</main>
      <NavBar />
    </div>
  );
};

export default Layout;
