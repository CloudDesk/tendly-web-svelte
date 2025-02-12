<script lang="ts">
    export let variant: 'spinner' | 'dots' | 'pulse' | 'bars' = 'spinner';
    export let size: 'sm' | 'md' | 'lg' = 'md';
    export let color: 'primary' | 'secondary' | 'success' | 'error' | 'white' = 'primary';
    export let text: string = '';
    export let fullScreen: boolean = false;
  
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
  
    const colorClasses = {
      primary: 'text-indigo-600',
      secondary: 'text-gray-600',
      success: 'text-green-600',
      error: 'text-red-600',
      white: 'text-white'
    };
  </script>
  
  {#if fullScreen}
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
        <div class="relative">
          {#if variant === 'spinner'}
            <div class={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
              <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          {:else if variant === 'dots'}
            <div class="flex space-x-2">
              {#each Array(3) as _, i}
                <div class={`${sizeClasses[size].split(' ')[0]} aspect-square rounded-full ${colorClasses[color]} animate-bounce`} 
                     style={`animation-delay: ${i * 0.15}s`}></div>
              {/each}
            </div>
          {:else if variant === 'pulse'}
            <div class={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse rounded-full border-2 border-current`}></div>
          {:else if variant === 'bars'}
            <div class="flex items-end space-x-1 h-full">
              {#each Array(4) as _, i}
                <div class={`w-1.5 ${colorClasses[color]} animate-wave`} 
                     style={`height: ${Math.max(40, Math.random() * 100)}%; animation-delay: ${i * 0.15}s`}></div>
              {/each}
            </div>
          {/if}
        </div>
        {#if text}
          <p class="text-gray-700 font-medium text-sm">{text}</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-3">
      <div class="relative">
        {#if variant === 'spinner'}
          <div class={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
            <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else if variant === 'dots'}
          <div class="flex space-x-2">
            {#each Array(3) as _, i}
              <div class={`${sizeClasses[size].split(' ')[0]} aspect-square rounded-full ${colorClasses[color]} animate-bounce`} 
                   style={`animation-delay: ${i * 0.15}s`}></div>
            {/each}
          </div>
        {:else if variant === 'pulse'}
          <div class={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse rounded-full border-2 border-current`}></div>
        {:else if variant === 'bars'}
          <div class="flex items-end space-x-1 h-full">
            {#each Array(4) as _, i}
              <div class={`w-1.5 ${colorClasses[color]} animate-wave`} 
                   style={`height: ${Math.max(40, Math.random() * 100)}%; animation-delay: ${i * 0.15}s`}></div>
            {/each}
          </div>
        {/if}
      </div>
      {#if text}
        <p class="text-gray-700 font-medium text-sm">{text}</p>
      {/if}
    </div>
  {/if}
  
  <style>
    @keyframes wave {
      0%, 100% {
        transform: scaleY(0.5);
      }
      50% {
        transform: scaleY(1);
      }
    }
  
    .animate-wave {
      animation: wave 1s ease-in-out infinite;
    }
  </style>


<!-- 
// Basic spinner 
<Loader />

 // Dots loader with custom size and color 
<Loader variant="dots" size="lg" color="primary" />

 // Pulse loader with text 
<Loader variant="pulse" text="Loading data..." />

// Full screen loader with bars 
<Loader variant="bars" fullScreen={true} text="Please wait..." />
-->