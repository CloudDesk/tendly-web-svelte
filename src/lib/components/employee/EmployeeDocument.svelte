<script lang="ts">
    import { documentsApi } from "$lib/services/api";
    import { auth } from "$lib/stores/auth";
    import { getAccessConfig } from "$lib/utils/document";
    import Modal from "../common/Modal.svelte";
    import { toast } from "../common/stores/toast.store";
    import AdminCertificateForm from "../documentCenter/AdminCertificateForm.svelte";
    import SkillCertificateForm from "../documentCenter/SkillCertificateForm.svelte";
    import DocumentViewer from "../documentCenter/DocumentViewer.svelte";

    const user = $auth?.user;
    export let access: "own" | "team" | "global" = "global";
    export let employeeId;
    let isShowModal = false;
    let actionType: string;
    console.log(access, "Access employeeDoc");
    // Configuration based on access type
    $: config = getAccessConfig(access);

    let refreshKey = 0;
    let showAddCertificateModal = false;
    let isLoading = false;

    // Edit modal state
    let showEditModal = false;
    let isSubmittingEdit = false;
    let editingDocument = null;
    let editFormType = null; // 'skill' or 'admin'

    async function getDocument(docId: string) {
        if (!docId) return;
        try {
            const response: any = await documentsApi.getById(docId);
            console.log(response, "getDocument");
            if (response.success) {
                return response.data;
            }
        } catch (error) {
            toast.error("Failed to fetch documents");
            return;
        }
    }
    async function handlePreview(event: CustomEvent) {
        const { docId, documentType, action } = event.detail;
        console.log("Preview document:", docId, "Type:", documentType);
        // Open preview modal or navigate to preview page
        try {
            let res = await getDocument(docId);
            console.log(res, "res handlePreview");
            isShowModal = true;
            actionType = action;
            //make sure the res.category==="Certification"
            //if the document type is skill - bind SkillCertificateForm
            // else bind AdminCertificateForm
        } catch (error) {
            toast.error("Failed to fetch document");
        }
    }

    function handleCustomAction(event: CustomEvent) {
        const { action, docId, documentType } = event.detail;
        console.log(
            "Custom action:",
            action,
            "Document:",
            docId,
            "Type:",
            documentType,
        );
        // Handle custom actions
    }

    function handleDataLoaded(event: CustomEvent) {
        const { documents, documentType } = event.detail;
        console.log(
            "Data loaded for:",
            documentType,
            "Count:",
            documents?.data?.length || 0,
        );
        // Optional: Handle data loaded event
    }

    function handleError(event: CustomEvent) {
        const { error, documentType } = event.detail;
        console.error("Error loading documents for:", documentType, error);
        // Handle error (show toast, etc.)
    }

    async function getDocRecord(docId: string) {
        try {
            const result: any = await documentsApi.getById(docId);
            if (result.success && result.data) {
                return result.data;
            } else {
                toast.error("Failed to fetch document details");
                return null;
            }
        } catch (error) {
            console.error("Error fetching document:", error);
            toast.error("Failed to fetch document details");
            return null;
        }
    }

    async function handleEditDocument(docId: string) {
        try {
            const document = await getDocRecord(docId);
            if (!document) return;
            console.log(document, "handleEditDocument");
            // Make sure the document category is "Certification"
            if (document.category !== "Certification") {
                toast.error(
                    "This document is not a certification and cannot be edited",
                );
                return;
            }

            editingDocument = document;

            // Determine form type based on certificate type
            if (document.metadata?.certificate?.certificateType === "Skill") {
                editFormType = "skill";
            } else {
                editFormType = "admin";
            }

            showEditModal = true;
        } catch (error) {
            console.error("Error preparing edit:", error);
            toast.error("Failed to open document for editing");
        }
    }

    async function handleDocumentAction(event: CustomEvent) {
        const { action, docId, documentType } = event.detail;

        console.log(
            "Document action:",
            action,
            "Document:",
            docId,
            "Type:",
            documentType,
        );

        switch (action) {
            case "preview":
                handlePreview(event);
                break;
            case "view":
                handlePreview(event);
                break;
            case "edit":
                await handleEditDocument(docId);
                break;
            case "delete":
                handleDeleteDocument(docId);
                break;
            default:
                console.log("Unhandled document action:", action);
        }
    }

    async function handleDeleteDocument(docId: string) {
        try {
            await documentsApi.deleteCertificate(docId);
            toast.success(`Document ${docId} deleted successfully`);
            refreshKey++; // Refresh the document list
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Failed to delete document");
        }
    }

    // Unified verify function to call the API
    async function handleVerifyFunction(
        id: string,
        status: "approve" | "reject",
    ) {
        const payload = {
            status: status === "approve" ? "Verified" : "Rejected",
            comments:
                status === "approve"
                    ? "Document Approved"
                    : "Document Rejected",
        };

        try {
            const result = await documentsApi.verifyCertificate(id, payload);
            console.log(result, "result");
            toast.success(`Certificate ${id} ${status}d successfully`);
            refreshKey++; // Trigger refresh
        } catch (error) {
            console.error(`Error while trying to ${status} certificate`, error);
            toast.error(`Failed to ${status} certificate`);
        }
    }

    // Event handler for UI interaction (e.g., dropdown click)
    async function handleVerifyAction(event: CustomEvent) {
        const { action, docId, documentType } = event.detail;
        console.log(
            "Verify action:",
            action,
            "Document:",
            docId,
            "Type:",
            documentType,
        );

        if (action === "approve" || action === "reject") {
            await handleVerifyFunction(docId, action);
        } else {
            console.warn("Unhandled verify action:", action);
        }
    }

    function handleAddCertificate() {
        showAddCertificateModal = true;
    }

    async function handleAdminCertSubmit(event: CustomEvent) {
        isLoading = true;
        try {
            const { file, certificateData } = event.detail;

            console.log(event.detail, "handleAdminCertSubmit");
            const formData = new FormData();
            if (!user?._id) {
                toast.error("User ID is required to add certificate.");
                return;
            }
            // Manipulate certificateData as per BE requirements
            const documentData = {
                type: "Certificate",
                category: "Certification",
                accessLevel: "Private",
                metadata: {
                    certificate: certificateData,
                },
            };
            console.log(documentData, "documentData");
            formData.append("file", file);
            formData.append("documentData", JSON.stringify(documentData));
            formData.append("employeeId", user._id);

            console.log(formData, "appendFormData");
            const result = await documentsApi.addCertificate(formData);
            console.log(result, "result");
            if (result.success) {
                toast.success("Certificate added successfully!");
                isLoading = false;
                refreshKey++; // Trigger a refresh in the viewer
            } else {
                toast.error(result.error || "Failed to add certificate.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add certificate.");
        } finally {
            isLoading = false;
            showAddCertificateModal = false;
        }
    }

    async function handleEditSkillSubmit(event: CustomEvent) {
        isSubmittingEdit = true;
        const { file, certificateData } = event.detail;

        try {
            // Preserve complete document structure with updated certificate data
            const documentPayload = {
                ...editingDocument, // Preserve all existing document fields
                type: "Certificate",
                category: "Certification",
                fileName: file?.name || editingDocument.fileName,
                accessLevel: editingDocument.accessLevel || "Private",
                metadata: {
                    ...editingDocument.metadata, // Preserve all existing metadata
                    certificate: certificateData, // Use complete certificate data from form
                },
            };

            const formData = new FormData();
            if (!user?._id) {
                toast.error("User ID is required to update certificate.");
                return;
            }

            if (file) {
                formData.append("file", file);
            }
            formData.append("documentData", JSON.stringify(documentPayload));
            formData.append("employeeId", user._id);

            const result = await documentsApi.updateCertificate(
                editingDocument._id,
                formData,
            );
            if (result.success) {
                toast.success("Skill certificate updated successfully!");
                showEditModal = false;
                editingDocument = null;
                refreshKey++;
            } else {
                toast.error(result.error || "Failed to update certificate.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
            console.error(error);
        } finally {
            isSubmittingEdit = false;
        }
    }

    async function handleEditAdminSubmit(event: CustomEvent) {
        console.log("handleEditAdminSubmit", event);
        isSubmittingEdit = true;
        console.log(editingDocument, "editingDocument");

        try {
            const { file, certificateData } = event.detail;
            const formData = new FormData();
            if (!user?._id) {
                toast.error("User ID is required to add certificate.");
                return;
            }
            if (!editingDocument._id) {
                toast.error("Document ID is required to update certificate.");
                return;
            }

            // Manipulate certificateData as per BE requirements
            const documentData = {
                type: "Certificate",
                category: "Certification",
                accessLevel: "Private",
                metadata: {
                    certificate: certificateData,
                },
            };
            console.log(documentData, "documentData");
            formData.append("file", file);
            formData.append("documentData", JSON.stringify(documentData));
            formData.append("employeeId", user._id);
            console.log(formData, "appendFormData");
            const result = await documentsApi.updateCertificate(
                editingDocument._id,
                formData,
            );
            console.log(result, "result updateCertificate");
            if (result.success) {
                toast.success("Certificate added successfully!");
                isLoading = false;
                refreshKey++; // Trigger a refresh in the viewer
            } else {
                toast.error(result.error || "Failed to add certificate.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update certificate.");
        } finally {
            isSubmittingEdit = false;
            showEditModal = false;
            editingDocument = null;
        }
    }
</script>

<DocumentViewer
    {employeeId}
    accessType={access}
    enabledTabs={config.enabledTabs}
    showAddSkill={config.showAddSkill}
    rowActions={config.rowActions}
    showAddCertificate={config.showAddCertificate}
    {refreshKey}
    on:preview={handlePreview}
    on:customAction={handleCustomAction}
    on:dataLoaded={handleDataLoaded}
    on:error={handleError}
    on:addCertificate={handleAddCertificate}
    on:documentAction={handleDocumentAction}
    on:verifyAction={handleVerifyAction}
/>

{#if showAddCertificateModal}
    <Modal
        title="Add Certifcates"
        show={showAddCertificateModal}
        onClose={() => (showAddCertificateModal = false)}
        wide={false}
    >
        <AdminCertificateForm
            loading={isLoading}
            on:submit={handleAdminCertSubmit}
            on:cancel={() => (showAddCertificateModal = false)}
        />
    </Modal>
{/if}

{#if showEditModal && editingDocument}
    <Modal
        show={showEditModal}
        title={`Edit ${editFormType === "skill" ? "Skill" : "Admin"} Certificate`}
        onClose={() => {
            showEditModal = false;
            editingDocument = null;
            editFormType = null;
        }}
    >
        {#if editFormType === "skill"}
            <SkillCertificateForm
                loading={isSubmittingEdit}
                initialData={editingDocument.metadata?.certificate}
                currentFilePath={editingDocument.filePath}
                on:submit={handleEditSkillSubmit}
                on:cancel={() => {
                    showEditModal = false;
                    editingDocument = null;
                    editFormType = null;
                }}
            />
        {:else if editFormType === "admin"}
            <AdminCertificateForm
                loading={isSubmittingEdit}
                initialData={editingDocument.metadata?.certificate}
                currentFilePath={editingDocument.filePath}
                on:submit={handleEditAdminSubmit}
                on:cancel={() => {
                    showEditModal = false;
                    editingDocument = null;
                    editFormType = null;
                }}
            />
        {/if}
    </Modal>
{/if}

{#if isShowModal}
    <Modal
        title={`${actionType} Certifcates`}
        show={showAddCertificateModal}
        onClose={() => (showAddCertificateModal = false)}
        wide={false}
    ></Modal>
{/if}
