import {NavLink} from "react-router";
import {FaHome} from "react-icons/fa";

type HeaderProps = {
    onMenuToggle: () => void;
};

export const Header = ({onMenuToggle}: HeaderProps) => {
    return (
        <header className="flex items-center justify-between p-4 h-[75px]">
            <div className="flex items-center gap-4">
                {/* Кнопка меню для мобильных */}
                <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 rounded-md hover:bg-gray-200"
                >
                    ☰
                </button>
                <div className="flex items-center text-sm gap-1.5">
                    <FaHome/>
                    <NavLink
                        to="/"
                        className="flex items-center font-medium text-gray-800 hover:text-blue-600"
                    >
                        Главная
                    </NavLink>

                </div>
            </div>
            {/* Другие элементы хедера */}
        </header>
    );
};
