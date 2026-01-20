import React from "react";
import { Link } from "react-router-dom";

export default function PagesDropdown() {
  return (
    <>
      <a
        className="text-blueGray-700 py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-sm"
        href="#"
        onClick={(e) => e.preventDefault()}
      >
        Pages
      </a>
      <div className="h-0 my-2 border border-solid border-blueGray-100" />
      <Link
        to="/"
        className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700"
      >
        Home
      </Link>
      <Link
        to="/rank"
        className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700"
      >
        Rank
      </Link>
      <Link
        to="/audit"
        className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700"
      >
        Audit
      </Link>
    </>
  );
}
