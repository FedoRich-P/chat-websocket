import { NavLink } from "react-router";
import { FaHome } from "react-icons/fa";

export const Header = () => {
    return (
        <header className="h-[75px] flex items-center justify-start px-8 bg-gray-100 border-b border-gray-300 shadow-sm">
            <div className="flex items-center text-sm gap-1.5">
                <NavLink
                    to="/"
                    className="flex items-center font-medium text-gray-800 hover:text-blue-600"
                >
                    <FaHome/>
                    Главная
                </NavLink>
            </div>
        </header>
    );
};
