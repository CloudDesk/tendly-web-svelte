<script lang="ts">
  import logoSmall from "$lib/assets/Tendly_T_logo.png";
</script>

<div class="flex flex-col gap-4 w-full items-center justify-center">
  <div class="loading-container">
    <img src={logoSmall} class="loading-image" alt="Tendly logo" />
  </div>
</div>

<style>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 7rem; /* 28 * 4px = 112px = 7rem */
    height: 7rem;
    border: 0.5rem solid #cbd5e0; /* border-gray-300 */
    border-top: 0.5rem solid #60a5fa; /* border-t-blue-400 */
    border-radius: 50%;
    overflow: hidden; /* Ensure no overflow */
    animation: spin 1s linear infinite;
  }

  .loading-image {
    width: 3rem; /* Adjust size as needed */
    height: 3rem;
    animation: ping 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ping {
    0%,
    75%,
    100% {
      opacity: 1;
    }
    25% {
      opacity: 0.5;
    }
  }
</style>
