import { useState } from "react";
import Swal from "sweetalert2";
import { FileText, Plus } from "lucide-react";

export default function AdminContentManagement() {
  const [contents, setContents] = useState([
    {
      id: 1,
      title: "Getting Started Guide",
      type: "Article",
      updated: "2026-01-01",
      status: "Published",
    },
    {
      id: 2,
      title: "Workout Tips for Beginners",
      type: "Blog Post",
      updated: "2025-12-30",
      status: "Draft",
    },
  ]);

  const addContent = () => {
    Swal.fire({
      title: "Add New Content",
      input: "text",
      inputLabel: "Content Title",
      inputPlaceholder: "Enter title",
      showCancelButton: true,
      confirmButtonText: "Add",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        setContents([
          ...contents,
          {
            id: Date.now(),
            title: result.value,
            type: "Article",
            updated: new Date().toISOString().split("T")[0],
            status: "Draft",
          },
        ]);

        Swal.fire("Added!", "Content added successfully.", "success");
      }
    });
  };

  const toggleStatus = (id) => {
    setContents(
      contents.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Published" ? "Draft" : "Published",
            }
          : item
      )
    );
  };

  return (
    <>
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        📄 Content Management
      </h1>
      <p className="text-gray-500 mt-1">
        Manage platform content and resources
      </p>

      {/* CARD */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">

        {/* ADD BUTTON */}
        <button
          onClick={addContent}
          className="mb-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Content
        </button>

        {/* CONTENT LIST */}
        <div className="space-y-4">
          {contents.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border rounded-xl p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-4">
                <FileText className="text-purple-600 mt-1" />

                <div>
                  <h3 className="font-semibold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.type} • Updated {item.updated}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <button
                onClick={() => toggleStatus(item.id)}
                className={`px-4 py-1 rounded-full text-sm font-medium
                  ${
                    item.status === "Published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {item.status}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
