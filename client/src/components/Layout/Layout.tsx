import { Outlet } from "react-router";
import { Header } from "../Header/Header";
import { Sidebar } from "../Sidebar/Sidebar";

export const Layout = () => {
    return (
        <div className="grid grid-rows-[75px_1fr] grid-cols-[200px_1fr] grid-areas-layout h-screen w-screen bg-[#fafafa]">
            <div className="col-span-2 row-start-1">
                <Header />
            </div>
            <aside className="bg-[#f0f0f0] border-r border-gray-300 p-4 overflow-y-auto">
                <Sidebar />
            </aside>
            <main className="bg-white p-8 overflow-y-auto border-l border-gray-200 shadow-inner">
                <Outlet />
            </main>
        </div>
    );
};
