"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, FileText, Bot, Loader2, RefreshCw } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";

const GET_DOCUMENTS = `
  query {
    documents {
      id
      name
      type
      url
      status
      uploadedAt
      employeeFirstName
      employeeLastName
      aiScore
    }
  }
`;

const VALIDATE_DOC = `
  mutation ValidateDocument($id: ID!, $validatorId: ID!) {
    validateDocument(id: $id, validatorId: $validatorId) { id status }
  }
`;

const REJECT_DOC = `
  mutation RejectDocument($id: ID!, $validatorId: ID!) {
    rejectDocument(id: $id, validatorId: $validatorId) { id status }
  }
`;

interface Doc {
  id: string; name: string; type: string; url: string; status: string;
  uploadedAt: string; employeeFirstName: string; employeeLastName: string; aiScore: number | null;
}

export default function DocumentsValidationPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const ADMIN_ID = user?.id || "";
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [filtered, setFiltered] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchGraphQL<{ documents: Doc[] }>(GET_DOCUMENTS)
      .then((d) => { setDocuments(d.documents); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = documents;
    if (search) list = list.filter((d) =>
      `${d.employeeFirstName} ${d.employeeLastName} ${d.name}`.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter) list = list.filter((d) => d.status === statusFilter);
    setFiltered(list);
  }, [search, statusFilter, documents]);

  const handleValidate = async (id: string) => {
    setActionLoading(id + "_v");
    try {
      await fetchGraphQL(VALIDATE_DOC, { id, validatorId: ADMIN_ID });
      setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, status: "VALIDATED" } : d));
      addToast({ type: "success", title: "Document validé", message: "Le document a été validé avec succès." });
    } catch (e) { console.error(e); addToast({ type: "error", title: "Erreur", message: "Impossible de valider le document." }); } finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "_r");
    try {
      await fetchGraphQL(REJECT_DOC, { id, validatorId: ADMIN_ID });
      setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, status: "REJECTED" } : d));
      addToast({ type: "warning", title: "Document rejeté", message: "Le document a été rejeté. L'employé sera notifié." });
    } catch (e) { console.error(e); addToast({ type: "error", title: "Erreur", message: "Impossible de rejeter le document." }); } finally { setActionLoading(null); }
  };

  const statusLabel: Record<string, string> = { PENDING: "En attente", VALIDATED: "Validé", REJECTED: "Rejeté" };
  const statusClass: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    VALIDATED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Validation des Documents</h1>
          <p className="text-gray-500 mt-1">Vérifiez et validez les documents soumis par les nouveaux salariés.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input type="text" placeholder="Rechercher par employé..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="VALIDATED">Validé</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  {["Employé", "Document", "Date d'envoi", "Score IA", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun document trouvé.</td></tr>
                ) : filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.employeeFirstName} {doc.employeeLastName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center"><FileText className="w-4 h-4 text-gray-400 mr-2" /><span className="text-gray-800 font-medium">{doc.name}</span></div>
                      <span className="text-xs text-gray-500 ml-6">{doc.type}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      {doc.aiScore != null ? (
                        <div className="flex items-center text-sm">
                          <Bot className={`w-4 h-4 mr-1 ${doc.aiScore > 90 ? "text-green-500" : doc.aiScore > 70 ? "text-yellow-500" : "text-red-500"}`} />
                          <span className={`font-semibold ${doc.aiScore > 90 ? "text-green-600" : doc.aiScore > 70 ? "text-yellow-600" : "text-red-600"}`}>{doc.aiScore}%</span>
                        </div>
                      ) : <span className="text-gray-400 text-xs">Non analysé</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass[doc.status]}`}>
                        {statusLabel[doc.status] || doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {doc.status === "PENDING" ? (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleValidate(doc.id)} disabled={!!actionLoading}
                            className="bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center border border-green-100 disabled:opacity-50">
                            {actionLoading === doc.id + "_v" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Valider</>}
                          </button>
                          <button onClick={() => handleReject(doc.id)} disabled={!!actionLoading}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center border border-red-100 disabled:opacity-50">
                            {actionLoading === doc.id + "_r" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" /> Rejeter</>}
                          </button>
                        </div>
                      ) : (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Voir document</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
