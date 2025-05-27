<script lang="ts">
	import '../app.css';

	import { version } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { updated, page } from '$app/state';
	import { base } from '$app/paths';
	import { get } from 'svelte/store';

	import { isAuthenticated, user, lastpage } from 'auth';
    import Login from '$lib/Login.svelte'
	import config from 'config';
	import { client } from 'client';

	import { FooterCopyright, Navbar, NavBrand, NavLi, NavUl, NavHamburger,
			 Avatar, DropdownHeader, DropdownItem, Dropdown } from 'flowbite-svelte';
	import { stored_version } from 'config';


	let { children } = $props();

	beforeNavigate(({ willUnload, from, to }) => {
		// Track last visited page
		let url = ""
		if(!from || !from.url){
			url = "/"
		} else {
			url = from!.url.toString()
		}
		lastpage.set(url);

		// necessary when production version gets updated
		// https://svelte.dev/docs/kit/configuration#version
		if (updated.current){ // Update detected.
			localStorage.clear(); // Clear all svelte-persisted-stores.
			stored_version.set(version);
			if (!willUnload && to?.url) {
				location.href = to.url.href;
			}
		}
	});


	let activeUrl = $state<string>();
	$effect(() => { activeUrl = page.url.pathname; })


	// Set server url for codegen fetch client.
	client.setConfig({
		baseUrl: get(config).endpoint,
	});
</script>

<style>
	#logout::after {
		text-align: center;
	    background: theme('colors.primary.600');
		content:url('data:image/svg+xml,<svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/></svg>');
		-webkit-mask:url("data:image/svg+xml,<svg class='w-6 h-6' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2'/></svg>") center/contain no-repeat;
				mask:url("data:image/svg+xml,<svg class='w-6 h-6' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2'/></svg>") center/contain no-repeat;
	}
</style>

<svelte:head>
	<link rel="icon" href={base + "/3TR.ico"} type="image/x-icon" />
</svelte:head>

<div class="w-full">
	<!-- menu -->
	<Navbar rounded fluid={true} color="primary" class="mb-4">
		<NavBrand href={base + "/"}>
		  <img class="me-3 h-6 sm:h-9" alt="3TR Logo" src={base + "/3TR.ico"}/>
		  <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">3TR Data Warehouse</span>
		</NavBrand>
		{#if !$isAuthenticated}
			<div class="order-2 md:order-4">
				<Login />
			</div>
		{:else}
			<div class="flex items-center md:order-2">
				<Avatar id="avatar-menu">{$user.charAt(0)}</Avatar>
				<NavHamburger menuClass="w-full md:flex md:w-auto md:order-1" />
			</div>
			<Dropdown placement="bottom" triggeredBy="#avatar-menu">
				<DropdownHeader>
				<span class="block text-sm">{$user}</span>
				<!-- TODO: user first name, last name, email -->
				<!-- <span class="block truncate text-sm font-medium">name@flowbite.com</span> -->
				</DropdownHeader>
				<!-- <DropdownDivider /> -->
				<DropdownItem><a href={base + "/logout"} id="logout">Sign out</a></DropdownItem>
			</Dropdown>
		{/if}
		<div style="margin-left: -8rem;">
			<NavUl {activeUrl} >
			<NavLi class="text-lg" href={base + "/about"}>About</NavLi>
			<NavLi class="text-lg" href={base + "/docs"}>User Manual</NavLi>
			</NavUl>
		</div>
	  </Navbar>

	<!-- content -->
	<div class="container mx-auto">
		{@render children()}
	</div>

	<!-- footer -->
	<footer>
		<FooterCopyright href={base + "/"} by="CNAG" year={2025} />
	</footer>
</div>
