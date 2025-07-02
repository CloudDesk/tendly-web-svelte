<script lang="ts">
    import { documentsApi } from "$lib/services/api";
    import { auth } from "$lib/stores/auth";
    import { getAccessConfig } from "$lib/utils/document";
    import Modal from "../common/Modal.svelte";
    import { toast } from "../common/stores/toast.store";
    import AdminCertificateForm from "../documentCenter/AdminCertificateForm.svelte";
    import DocumentViewer from "../documentCenter/DocumentViewer.svelte";

    const user = $auth?.user;
    export let access: "own" | "team" | "global" = "global";
    export let employeeId;

    console.log(access, "Access employeeDoc");
    // Configuration based on access type
    $: config = getAccessConfig(access);

    let refreshKey = 0;
    let showAddCertificateModal = false;
    let isLoading = false;

    function handlePreview(event: CustomEvent) {
        const { docId, documentType } = event.detail;
        console.log("Preview document:", docId, "Type:", documentType);
        // Open preview modal or navigate to preview page
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

    function handleDocumentAction(event: CustomEvent) {
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
                toast.info(`Opening document ${docId} for viewing`);
                // Add your view logic here
                break;
            case "edit":
                toast.info(`Opening document ${docId} for editing`);
                // Add your edit logic here
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
            // Here you would call your API to delete the document
            // const result = await documentsApi.deleteDocument(docId);
            toast.success(`Document ${docId} deleted successfully`);
            refreshKey++; // Refresh the document list
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Failed to delete document");
        }
    }

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

        try {
            let result;
            switch (action) {
                case "approve":
                    // Call API to approve certificate
                    // result = await documentsApi.approveCertificate(docId);
                    toast.success(`Certificate ${docId} approved successfully`);
                    refreshKey++; // Refresh the data
                    break;
                case "reject":
                    // Call API to reject certificate
                    // result = await documentsApi.rejectCertificate(docId);
                    toast.error(`Certificate ${docId} rejected`);
                    refreshKey++; // Refresh the data
                    break;
                default:
                    console.log("Unhandled verify action:", action);
            }
        } catch (error) {
            console.error("Error processing verify action:", error);
            toast.error(`Failed to ${action} certificate`);
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
