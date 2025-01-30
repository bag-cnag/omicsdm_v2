<script>
    import { onMount } from 'svelte';
    import { loginUrl } from './remote/login';

    let url = $state();
    onMount(async ()=>{
        url = await loginUrl(); 
    })
</script>

<style>
  #login::after {
      text-align: center;
      background: white;
      content:url("data:image/svg+xml,<svg style='color: rgb(255 255 255);' class='w-6 h-6 text-white dark:text-gray-800' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2'/></svg>");
      -webkit-mask:url("data:image/svg+xml,<svg style='color: rgb(255 255 255);' class='w-6 h-6 text-white dark:text-gray-800' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2'/></svg>") center/contain no-repeat;
              mask:url("data:image/svg+xml,<svg style='color: rgb(255 255 255);' class='w-6 h-6 text-white dark:text-gray-800' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2'/></svg>") center/contain no-repeat;
  }
</style>

{#if url}
    <div>
        <a href="{url}" id="login" class="link-btn">
            Login &nbsp;
        </a>
    </div>
{/if}
